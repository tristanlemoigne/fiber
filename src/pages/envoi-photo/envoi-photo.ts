import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, AlertController } from 'ionic-angular';
import { FileTransfer, FileUploadOptions, FileTransferObject  } from '@ionic-native/file-transfer';
import { GetDataProvider } from '../../providers/get-data/get-data';
import { PostDataProvider } from '../../providers/post-data/post-data';
import { Geolocation } from '@ionic-native/geolocation';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { Instagram } from '@ionic-native/instagram';
import { AccueilPage } from '../accueil/accueil';

@IonicPage()
@Component({
  selector: 'page-envoi-photo',
  templateUrl: 'envoi-photo.html',
})
export class EnvoiPhotoPage {
  public imageTaken:string;
  public token:string;
  public tags:any;
  public vetement:string;
  public motif:number;
  public couleur:number;
  public prix:number;
  public magasin:string;
  public key:string='AIzaSyDIXgIkeXIofkhvFOblJZ0DnwDKQjXtc4Y';
  public lat:any;
  public long:any;
  public propositions:any;
  public vetements:any = [];
  public style:any;
  public saison:any;
  public occasion:any;
  public idPhoto:any;
  public description:any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public transfer:FileTransfer, public storage:Storage,
  public instagram:Instagram, public loading:LoadingController, public alert:AlertController, public getDataProvider:GetDataProvider,
  public location:Geolocation, public postData:PostDataProvider) {
    this.imageTaken = this.navParams.get('base64Image');
  }

  ngOnInit(){
    this.location.getCurrentPosition().then((resp) => {
      this.lat = resp.coords.latitude;
      this.long = resp.coords.longitude;
    }).catch((error) => {
      alert('Error getting location'+error);
    });
  }

  selectMagasin(prop){
    this.magasin = prop;
    this.propositions=[];
  }

  callMaps(){
    if(this.magasin == ""){
      this.propositions=[];
    }
    this.propositions=[];
    let headers = new HttpHeaders().set("Access-Control-Allow-Origin","*");
    let url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+this.lat+","+this.long+
    "&radius=10000&type=clothing_store&keyword="+this.magasin+"&key="+this.key;
    // alert(url);
    let promise = this.getDataProvider.getData(url,{headers});
    promise.subscribe(data=>{
      for(let i =0; i<data["results"].length;i++){
        this.propositions[i] = [data["results"][i].name+ " " +data["results"][i].vicinity,data["results"][i].name,data["results"][i].vicinity];
      }
    })
  }

  envoyer(){
    if(this.occasion == undefined || this.style == undefined || this.saison == undefined){
      alert("Veuillez renseigner une occasion, un style et une saison");
    } else{

      if(this.imageTaken){
        let fileTransfer: FileTransferObject = this.transfer.create();
        this.storage.get("token").then((val) =>{
          this.token=val;
          let options: FileUploadOptions = {
            fileKey: 'file',
            fileName:"test.jpg",
            params:{},
            headers:{Authorization: "Bearer "+this.token}
          }
          var loading = this.loading.create({
            content: "Envoi de la photo"
          });
          loading.present();
          fileTransfer.upload(this.imageTaken,
            'http://fiber-app.com/SERVER/postPhoto.php?occasion='+this.occasion+"&style="+this.style+"&saison="+this.saison+"&description="+this.description,
            options)
          .then((data)=>{
             loading.dismiss();
             this.idPhoto = data.response;
             let headers = new HttpHeaders().set("Authorization","Bearer "+this.token);
             let mydata = JSON.stringify({vetements: this.vetements,
                                          idPhoto:this.idPhoto});
             let link = "http://fiber-app.com/SERVER/postVetement.php";
             let req = this.postData.postData(link,mydata,{headers});
             req.subscribe(data => {
               if(data["response"] == "fail"){
                 let alert = this.alert.create({
                    title: 'Erreur',
                    subTitle: 'Photo non partagée, veuillez réessayer',
                    buttons: ["OK"]});

                  alert.present();
               } else{
                 let alert = this.alert.create({
                    title: 'Partagée !',
                    subTitle: 'Photo envoyée',
                    buttons: ["OK"]});

                  alert.present();
               }
             },
             (err)=>{
               alert(err.message);
             },()=>{
                this.navCtrl.setRoot(AccueilPage);
             });

          }, (err) => {
            alert("Erreur"+JSON.stringify(err));
          });

        });
      }
    }
  }

  partager(){
    if(this.instagram.isInstalled()){
      if(this.imageTaken){
        this.instagram.share(this.imageTaken)
        .then(()=>alert("shared"))
        .catch((error:any)=>alert("error"));
      }
    } else{
      alert("Veuillez installer l'application instagram");
    }

  }

  ajoutVetement(){
    if(this.vetement == undefined || this.couleur == undefined || this.motif == undefined || this.vetement == "" || this.couleur == 0 || this.motif == 0){
      alert("Veuillez rentrer au moins le type de vêtement, sa couleur et son motif");
    } else{
      let vet = {
        vetement:this.vetement,
        couleur:this.couleur,
        motif:this.motif,
        prix:null,
        nomMagasin:null,
        adresseMagasin:null
      };
      if(this.prix != undefined){
        vet.prix = this.prix;
      }
      if(this.magasin != undefined){
        vet.nomMagasin = this.magasin[1],
        vet.adresseMagasin = this.magasin[2]
        if(vet.adresseMagasin.length<=1){
          vet.nomMagasin = this.magasin;
          vet.adresseMagasin = "";
        }
      }
      this.vetements.push(vet);
      alert("Vêtement ajouté à la photo");
      this.vetement = "";
      this.couleur = 0;
      this.motif = 0;
      this.magasin ="";
    }


  }

  popView(){
    this.navCtrl.setRoot(AccueilPage)
  }
}
